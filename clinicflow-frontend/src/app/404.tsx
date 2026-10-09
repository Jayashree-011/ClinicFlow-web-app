
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <img
        src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070"
        alt="Page Not Found"
        className="w-1/2 max-w-md mt-8 rounded-lg shadow-lg"
      />
      <p className="text-xl text-gray-600 mt-4">Page Not Found</p>
      <p className="text-lg text-gray-500 mt-2">
        The page you are looking for does not exist.
      </p>
    </div>
  );
}