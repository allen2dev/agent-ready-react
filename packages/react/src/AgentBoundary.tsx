import { Component, type ErrorInfo, type ReactNode } from "react";
import type { AgentHandle } from "@agent-ready/schema";

export interface AgentBoundaryProps {
  handle: AgentHandle;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AgentBoundary extends Component<AgentBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
