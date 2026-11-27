import { createImageUrlBuilder } from "@sanity/image-url";
import { Box, Card, Spinner, Stack, Text } from "@sanity/ui";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type ObjectInputProps, set, setIfMissing, useClient } from "sanity";
import {
  type MapPosition,
  positionFromArrowKey,
  positionFromClick,
} from "./map-position";

// The draft ("drafts.…" sorts first) wins over the published photo, so a
// new photo shows before it is published.
const AERIAL_PHOTO_QUERY = `*[_type == "resortMap" && defined(image.asset)]
  | order(_id asc)[0].image.asset._ref`;

type PhotoState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; url: string };

function useAerialPhotoUrl(): PhotoState {
  const client = useClient({ apiVersion: "2026-03-23" });
  const [state, setState] = useState<PhotoState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    client
      .fetch<string | null>(AERIAL_PHOTO_QUERY)
      .then((assetRef) => {
        if (!active) return;
        if (!assetRef) return setState({ status: "missing" });
        // The whole photo, never a crop: positions are measured on it.
        const url = createImageUrlBuilder(client)
          .image(assetRef)
          .width(1600)
          .auto("format")
          .url();
        setState({ status: "ready", url });
      })
      .catch(() => {
        if (active) setState({ status: "missing" });
      });
    return () => {
      active = false;
    };
  }, [client]);

  return state;
}

const formatPercent = (value: number | undefined) =>
  typeof value === "number" ? `${value}%` : "not set";

export function MapPositionInput(props: ObjectInputProps) {
  const { onChange, readOnly, value } = props;
  const photo = useAerialPhotoUrl();
  const position = value as Partial<MapPosition> | undefined;
  const hasPin =
    typeof position?.x === "number" && typeof position?.y === "number";

  const save = useMemo(
    () => (next: MapPosition) =>
      onChange([
        setIfMissing({}),
        set(next.x, ["x"]),
        set(next.y, ["y"]),
      ]),
    [onChange],
  );

  if (photo.status === "loading") {
    return (
      <Card padding={4} border radius={2}>
        <Spinner muted />
      </Card>
    );
  }

  if (photo.status === "missing") {
    return (
      <Stack space={3}>
        <Card padding={3} border radius={2} tone="caution">
          <Text size={1}>
            The Resort map has no aerial photo yet. Upload it in Resort map to
            place the pin by clicking the photo. Until then, type the position
            below.
          </Text>
        </Card>
        {props.renderDefault(props)}
      </Stack>
    );
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const box = event.currentTarget.getBoundingClientRect();
    const next = positionFromClick({
      offsetX: event.clientX - box.left,
      offsetY: event.clientY - box.top,
      width: box.width,
      height: box.height,
    });
    if (next) save(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const next = positionFromArrowKey(
      position,
      event.key,
      event.shiftKey ? 5 : 0.5,
    );
    if (!next) return;
    event.preventDefault();
    save(next);
  };

  return (
    <Stack space={3}>
      <Card border radius={2} overflow="hidden">
        <div
          aria-label={`Aerial photo. Click to place the pin, or use the arrow keys to move it (hold Shift for bigger steps). Pin from the left: ${formatPercent(position?.x)}, from the top: ${formatPercent(position?.y)}.`}
          aria-readonly={readOnly || undefined}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="application"
          style={{
            cursor: readOnly ? "default" : "crosshair",
            lineHeight: 0,
            position: "relative",
            touchAction: "manipulation",
            userSelect: "none",
          }}
          tabIndex={readOnly ? -1 : 0}
        >
          <img
            alt=""
            draggable={false}
            src={photo.url}
            style={{ display: "block", height: "auto", width: "100%" }}
          />
          {hasPin && (
            <span
              aria-hidden="true"
              style={{
                left: `${position.x}%`,
                pointerEvents: "none",
                position: "absolute",
                top: `${position.y}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <svg
                fill="#e11d48"
                height="36"
                stroke="#fff"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                width="36"
                style={{ display: "block", filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))" }}
              >
                <path d="M12 23s-8-7.6-8-13.5a8 8 0 0 1 16 0C20 15.4 12 23 12 23Z" />
                <circle cx="12" cy="9.5" fill="#fff" r="3" stroke="none" />
              </svg>
            </span>
          )}
        </div>
      </Card>
      <Box>
        <Text muted size={1}>
          {hasPin
            ? `Pin from the left: ${position.x}%, from the top: ${position.y}%. Click the photo to move it.`
            : "Click the photo where the pin should sit."}
        </Text>
      </Box>
    </Stack>
  );
}
