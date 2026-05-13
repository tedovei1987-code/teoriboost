export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0B1020] px-5 py-10 text-white">
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center">
        <p className="text-sm font-bold text-[#3EE6B0]">TeoriBoost</p>

        <h1 className="mt-4 text-4xl font-extrabold">
          Logg inn eller start gratis
        </h1>

        <p className="mt-3 text-[#94A3B8]">
          Første versjon av innlogging kommer her.
        </p>

        <a
          href="/"
          className="mt-8 rounded-xl bg-[#3EE6B0] px-5 py-3 text-center font-bold text-[#0B1020]"
        >
          Fortsett
        </a>
      </section>
    </main>
  );
}