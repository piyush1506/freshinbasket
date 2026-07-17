import SearchComponent from "./SearchComponent";

// Search result pages should not be indexed — they are dynamic user-query pages
// that produce duplicate/thin content and use query-param URLs.
export const metadata = {
  title: "Search Products | Freshinbasket",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchPage() {
  return <SearchComponent />;
}
