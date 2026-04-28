export default function UserManage() {
  return (
    <section className="flex-1 p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest">Users</p>
          <h1 className="text-3xl font-semibold leading-tight">Manage</h1>
        </header>
        <button type="button" className="btn border">
          New User
        </button>
      </div>
    </section>
  )
}
