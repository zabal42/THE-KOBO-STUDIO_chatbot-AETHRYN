import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">Kobo Assistant</h1>
      <p className="max-w-xl text-gray-500">
        Un motor conversacional, muchas configuraciones. Cada asistente tiene su
        identidad, sus instrucciones y su base de conocimiento, y se instala en
        cualquier web con una sola línea.
      </p>
      <Link
        href="/widget"
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80"
      >
        Sala de demos
      </Link>
    </div>
  );
}
