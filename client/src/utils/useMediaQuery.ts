import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if the window object is available
    if (typeof window !== "undefined") {
      const mediaQueryList = window.matchMedia(query);

      // Set the initial matches state
      setMatches(mediaQueryList.matches);

      // Create an event listener for changes in the media query
      const handleChange = () => setMatches(mediaQueryList.matches);
      mediaQueryList.addEventListener("change", handleChange);

      // Clean up the event listener on component unmount
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }
  }, [query]);

  return matches;
}
