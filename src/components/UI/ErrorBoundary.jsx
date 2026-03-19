import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">Error de Arquitectura</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              El sistema ha encontrado una falla crítica en la renderización del módulo actual.
            </p>
            <div className="bg-black/40 rounded-2xl p-4 text-left font-mono text-[10px] text-red-400 overflow-x-auto mb-6 max-h-40">
              <p className="font-bold mb-1">{this.state.error?.toString()}</p>
              <pre className="opacity-70">{this.state.errorInfo?.componentStack}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl uppercase tracking-widest transition-all shadow-lg shadow-red-900/40"
            >
              Reiniciar Comando Central
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
