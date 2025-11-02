import './Loading.css';

function Loading() {
  return (
    <div className="loading-container">
      <div className="santa-loader">
        <div className="santa-icon">🎅</div>
        <div className="loading-text">Loading...</div>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
}

export default Loading;

