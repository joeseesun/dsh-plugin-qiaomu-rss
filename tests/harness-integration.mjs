import assert from 'node:assert/strict';
import { nativeChatBridge } from '../src/client/native-chat.js';
let draft,opened,released=false,scope,cleanup;
const bridge=nativeChatBridge({inject(names,cb){assert.ok(names.includes('uiSession'));scope=cb;}});
assert.deepEqual(bridge.chatWorkspaces(),[]);assert.equal(bridge.defaultChatWorkspace(),undefined);await assert.rejects(bridge.openChat({workspaceId:'w',prompt:'p'}));
cleanup=scope({
 sessions:{async create(request){assert.deepEqual(request,{workspaceId:'w'});return 's';},retain(id){return {sessionId:id,release(){released=true;}};}},
 uiWorkspace:{workspaces:{list:{getSnapshot:()=>({items:[{workspaceId:'other',path:'/workspace'},{workspaceId:'w',path:'/workspace/default-workspace'}]})}},openSession(id){opened=id;}},
 uiSession:{bindingSource(){return {value:{props:{inputActions:{setDraft(text){draft=text;},captureInsertion(){return {draftRev:1};},insertText(text){draft=text;return true;}}}}};}},
});
assert.equal(bridge.defaultChatWorkspace(),'w');await assert.rejects(bridge.openChat({workspaceId:'bad',prompt:'p'}));
const chat=await bridge.openChat({workspaceId:'w'});chat.insertContext('article context');assert.equal(draft,'article context\n\n');assert.equal(opened,undefined);assert.equal(released,false);chat.release();assert.equal(released,true);
cleanup();assert.deepEqual(bridge.chatWorkspaces(),[]);assert.equal(bridge.defaultChatWorkspace(),undefined);
console.log('Harness integration: default workspace, session validation, native composer and cleanup passed');
