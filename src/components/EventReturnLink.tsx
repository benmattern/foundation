import { Link, useLocation, useSearchParams } from "react-router-dom";
export function EventReturnLink() {
  const [params] = useSearchParams(),
    location = useLocation();
  const value = params.get("returnTo");
  if (
    location.pathname.startsWith("/events") ||
    !value ||
    !/^\/events\/[a-zA-Z0-9-]+(?:\?.*)?$/.test(value)
  )
    return null;
  return (
    <p className="mb-4">
      <Link className="text-blue-300 underline" to={value}>
        Return to event
      </Link>
    </p>
  );
}
