const artwork = import.meta.glob("./assets/personality/*.webp", {
  eager: true,
  import: "default",
});

export const personalityPortraits = Object.fromEntries(
  Object.entries(artwork).map(([path, image]) => [
    path.split("/").at(-1).slice(0, -5).toUpperCase(),
    image,
  ]),
);
