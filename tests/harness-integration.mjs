import assert from 'node:assert/strict';
import { nativeChatBridge } from '../src/client/native-chat.js';
let draft,opened,released=false,scope,cleanup,submits=0;
const listeners=new Set();
const inputState={getSnapshot:()=>({draft:draft ?? '',phase:'plain',attachmentIds:[]}),subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
const bridge=nativeChatBridge({inject(names,cb){assert.ok(names.includes('uiSession'));scope=cb;}});
assert.deepEqual(bridge.chatWorkspaces(),[]);assert.equal(bridge.defaultChatWorkspace(),undefined);await assert.rejects(bridge.openChat({workspaceId:'w',prompt:'p'}));
cleanup=scope({
 sessions:{async create(request){assert.deepEqual(request,{workspaceId:'w'});return 's';},retain(id){return {sessionId:id,release(){released=true;}};}},
 uiWorkspace:{workspaces:{list:{getSnapshot:()=>({items:[{workspaceId:'other',path:'/workspace'},{workspaceId:'w',path:'/workspace/default-workspace'}]})}},openSession(id){opened=id;}},
 uiSession:{bindingSource(){return {value:{hooks:{input:inputState},props:{inputActions:{setDraft(text){draft=text;for(const fn of listeners)fn();},captureInsertion(){return {draftRev:1};},insertText(text){draft=text;for(const fn of listeners)fn();return true;},submit(){submits++;draft='';for(const fn of listeners)fn();}}}}};}},
});
assert.equal(bridge.defaultChatWorkspace(),'w');await assert.rejects(bridge.openChat({workspaceId:'bad',prompt:'p'}));
const chat=await bridge.openChat({workspaceId:'w'});assert.equal(draft,undefined,'opening companion must leave the composer untouched');
await chat.sendPrompt('概括要点');assert.equal(submits,1);assert.equal(draft,'');
draft='用户未发送的草稿';await assert.rejects(chat.sendPrompt('追问证据'),/已有草稿/);assert.equal(submits,1);assert.equal(draft,'用户未发送的草稿');
assert.equal(opened,undefined);assert.equal(released,false);chat.release();assert.equal(released,true);
cleanup();assert.deepEqual(bridge.chatWorkspaces(),[]);assert.equal(bridge.defaultChatWorkspace(),undefined);
console.log('Harness integration: default workspace, native quick send, draft protection and cleanup passed');
