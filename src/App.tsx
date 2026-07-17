function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <h1 className="font-heading text-4xl font-bold text-heading">
        Packing List
      </h1>
      <p className="font-body text-body">
        Frontend scaffold — routing and the real app shell are next.
      </p>
      <div className="rounded-card border border-border bg-bg-subtle px-4 py-3 font-body text-secondary">
        Design tokens are live: headings use Bricolage Grotesque, body text
        uses Karla.
      </div>
      <button
        type="button"
        className="rounded-full bg-accent px-5 py-2.5 font-body font-bold text-on-accent hover:bg-accent-hover"
      >
        Accent button
      </button>
    </main>
  )
}

export default App
