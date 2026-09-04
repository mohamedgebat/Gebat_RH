import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SIRH CRITICAL ERROR:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-10">
          <div className="max-w-md w-full bg-red-50 border-2 border-red-200 rounded-[3rem] p-10 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-black text-ci-text uppercase tracking-tighter mb-4">Erreur d'application</h2>
            <p className="text-sm font-medium text-ci-muted leading-relaxed mb-8">
              Une erreur inattendue est survenue. Veuillez rafraîchir la page ou contacter le support.
            </p>
            <div className="bg-white p-4 rounded-2xl text-[10px] font-mono text-left text-red-400 border border-red-100 mb-8 overflow-auto max-h-32">
                {this.state.error?.toString()}
            </div>
            <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-ci-text text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
            >
                Redémarrer l'interface
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
