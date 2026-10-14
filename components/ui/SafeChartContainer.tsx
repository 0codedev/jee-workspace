import React, { Component, ReactNode } from 'react';
import { BarChart2 } from 'lucide-react';
import { logger } from '../../services/Logger';

interface Props {
  children: ReactNode;
  height?: number | string;
}

interface State {
  hasError: boolean;
}

export class SafeChartContainer extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error) {
    logger.error('Chart render error caught by SafeChartContainer', error, 'SafeChartContainer');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400"
          style={{ height: this.props.height || 240 }}
        >
          <BarChart2 className="w-8 h-8 mb-2 text-slate-600" />
          <p className="text-xs font-medium">Chart visualization currently unavailable</p>
        </div>
      );
    }

    return this.props.children;
  }
}