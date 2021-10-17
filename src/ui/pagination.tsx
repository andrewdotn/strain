import React from "react";

export function Pagination(props: {
  page: number;
  itemsPerPage: number;
  count: number;
}) {
  const { page, count, itemsPerPage } = props;

  const pageLinks: {
    name: string;
    number: number;
    enabled: boolean;
    active?: boolean;
  }[] = [];

  if (count < itemsPerPage) {
    return false;
  }

  pageLinks.push({ name: "Previous", number: page - 1, enabled: page > 1 });
  pageLinks.push({
    name: page.toString(),
    number: page,
    enabled: false,
    active: true,
  });
  pageLinks.push({
    name: "Next",
    number: page + 1,
    enabled: page <= count / itemsPerPage,
  });
  pageLinks.push({
    name: "Last",
    number: Math.floor(count / itemsPerPage + 1),
    enabled: true,
  });

  return (
    <nav aria-label="Page navigation example">
      <ul className="pagination">
        {pageLinks.map((pl) => (
          <li
            key={pl.name}
            className={`page-item ${!pl.active && !pl.enabled && "disabled"} ${
              pl.active && "active"
            }`}
          >
            {pl.enabled ? (
              <a className="page-link" href={`?page=${pl.number}`}>
                {pl.name}
              </a>
            ) : (
              <span className="page-link">{pl.name}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
