import { forwardRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function Card({
  children,
  className = "",
  to,
}: {
  children: ReactNode;
  className?: string;
  to?: string;
}) {
  const cls = `bg-white rounded-2xl border border-gray-100 shadow-card ${className}`;
  if (to) {
    return (
      <Link to={to} className={`${cls} block transition-shadow hover:shadow-card-hover`}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {item.to ? (
            <Link to={item.to} className="hover:text-navy-700">
              {item.label}
            </Link>
          ) : (
            <span className="text-navy-700 font-medium">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-navy-800">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 ${className}`}
      style={{ width: "1.5rem", height: "1.5rem" }}
    />
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-error-50 flex items-center justify-center mb-3">
        <span className="text-error-500 text-xl">!</span>
      </div>
      <p className="text-sm text-error-600 max-w-sm">{message}</p>
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
    secondary: "bg-navy-900 text-white hover:bg-navy-800 shadow-sm",
    ghost: "text-navy-700 hover:bg-gray-100",
    danger: "bg-error-600 text-white hover:bg-error-700 shadow-sm",
    outline: "border border-gray-200 text-navy-700 hover:bg-gray-50 bg-white",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ label, error, className = "", ...props }, ref) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-navy-700 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border ${error ? "border-error-300" : "border-gray-200"} bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ label, error, className = "", ...props }, ref) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-navy-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full rounded-xl border ${error ? "border-error-300" : "border-gray-200"} bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition resize-none ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, { label?: string; error?: string } & React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ label, error, className = "", children, ...props }, ref) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-navy-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full rounded-xl border ${error ? "border-error-300" : "border-gray-200"} bg-white px-3.5 py-2.5 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
      </div>
    );
  }
);
