import { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export function htmlPage(element: ReactElement) {
  const contents = renderToStaticMarkup(element);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer">
    <title>Strain</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
    <style>
    .message__text {
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: max(400px,50vw);
    }
    </style>
  </head>
  <body>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <ul class="navbar-nav">
    <li class="nav-item">
    <a href="/" class="nav-link">Strain</a>
    </li>
    <li class="nav-item">
    <a href="/channels" class="nav-link">Channels</a>
    </li>
    <li class="nav-item">
    <a href="/users" class="nav-link">Users</a>
    </li>
    <li class="nav-item">
    <a href="/messages" class="nav-link">Messages</a>
    </li>
    <li class="nav-item">
    <a href="/files" class="nav-link">Files</a>
    </li>
    <li class="nav-item">
    <a href="/apiResults" class="nav-link">API results</a>
    </li>
  </nav>
    <div class="container">
        ${contents}
    </div>
  </body>
</html>`;
}
