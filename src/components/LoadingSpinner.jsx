function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm font-medium text-slate-600 shadow-sm">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      {label}
    </div>
  );
}

export default LoadingSpinner;
