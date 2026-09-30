import { Component } from 'react';
import { ReaderPage } from './ReaderPage.jsx';

class ReaderBoundary extends Component {
  state = { error: null, attempt: 0 };
  static getDerivedStateFromError(error) { return { error: error instanceof Error ? error.message : String(error) }; }
  render() {
    if (this.state.error) return <div role="alert" style={{ padding:24, color:'var(--dsw-alias-label-primary)' }}>
      <h2>乔木 RSS 页面加载失败</h2>
      <p style={{ whiteSpace:'pre-wrap' }}>{this.state.error}</p>
      <button type="button" onClick={() => this.setState((state) => ({error:null,attempt:state.attempt+1}))}>重新打开阅读器</button>
    </div>;
    return <ReaderPage key={this.state.attempt} {...this.props} />;
  }
}
export function ReaderPanel(props) { return <ReaderBoundary {...props} />; }
