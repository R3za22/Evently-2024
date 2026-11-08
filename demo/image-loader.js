// Demo-only next/image loader: static export, no optimizer; just prefixes the base path.
export default function loader({ src }) {
  return src.startsWith('/') ? `/demos/evently${src}` : src
}
