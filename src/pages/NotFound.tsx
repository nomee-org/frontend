import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { NotFoundSEO } from "@/components/seo/NotFoundSEO";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <>
      <NotFoundSEO requestedPath={location.pathname} />
      <div className="flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Large 404 */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold font-grotesk text-primary/20 leading-none">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-grotesk text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted-foreground text-lg">
              The page you're looking for doesn't exist or has been moved.
            </p>
            {location.pathname !== "/404" && (
              <p className="text-sm text-muted-foreground/70 font-mono bg-muted/50 px-3 py-1 rounded-md">
                {location.pathname}
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Home
            </Link>
            <div className="text-sm text-muted-foreground">
              Or try searching for what you need
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
