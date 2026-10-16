type Props = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: Props) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>

      {description && (
        <p className="text-slate-400 mt-2 text-lg">{description}</p>
      )}
    </header>
  );
}
