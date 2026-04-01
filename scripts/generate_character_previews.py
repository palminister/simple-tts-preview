#!/usr/bin/env python3
"""Generate static character preview audio files using Azure Speech."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
CHARACTER_DATA_PATH = ROOT / "src" / "data" / "characters.json"
OUTPUT_DIR = ROOT / "public" / "audio" / "characters"
DEFAULT_OUTPUT_FORMAT = "audio-24khz-160kbitrate-mono-mp3"


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'\"")

    return values


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate the static /characters preview mp3 files.",
    )
    parser.add_argument(
        "--region",
        help="Azure Speech region, for example eastus. Overrides AZURE_REGION or AZURE_SPEECH_REGION.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate files even when an mp3 already exists.",
    )
    return parser.parse_args()


def to_prosody_rate(rate: int) -> str:
    percentage = round(((rate - 150) / 150) * 100)
    return f"{percentage:+d}%"


def to_prosody_volume(volume: float) -> str:
    return f"{round(volume * 100)}%"


def voice_locale(voice_id: str) -> str:
    return "-".join(voice_id.split("-")[:2])


def build_ssml(character: dict[str, object], preview_text: str) -> str:
    voice_id = str(character["voice_id"])
    return (
        "<speak version='1.0' "
        f"xml:lang='{voice_locale(voice_id)}'>"
        f"<voice name='{escape(voice_id)}'>"
        f"<prosody rate='{to_prosody_rate(int(character['rate']))}' "
        f"volume='{to_prosody_volume(float(character['volume']))}'>"
        f"{escape(preview_text)}"
        "</prosody></voice></speak>"
    )


def synthesize_preview(
    *,
    api_key: str,
    region: str,
    ssml: str,
    destination: Path,
) -> None:
    url = f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1"
    request = urllib.request.Request(
        url,
        data=ssml.encode("utf-8"),
        headers={
            "Content-Type": "application/ssml+xml",
            "Ocp-Apim-Subscription-Key": api_key,
            "X-Microsoft-OutputFormat": DEFAULT_OUTPUT_FORMAT,
            "User-Agent": "voice-preview-generator",
        },
        method="POST",
    )

    with urllib.request.urlopen(request) as response:
        destination.write_bytes(response.read())


def main() -> int:
    args = parse_args()
    env_values = load_env_file(ENV_PATH)

    api_key = env_values.get("AZURE_API_KEY") or os.environ.get("AZURE_API_KEY")
    region = (
        args.region
        or env_values.get("AZURE_SPEECH_REGION")
        or env_values.get("AZURE_REGION")
        or os.environ.get("AZURE_SPEECH_REGION")
        or os.environ.get("AZURE_REGION")
    )

    if not api_key:
        print("Missing AZURE_API_KEY in .env or the shell environment.", file=sys.stderr)
        return 1

    if not region:
        print(
            "Missing Azure Speech region. Pass --region or set AZURE_REGION / AZURE_SPEECH_REGION.",
            file=sys.stderr,
        )
        return 1

    payload = json.loads(CHARACTER_DATA_PATH.read_text(encoding="utf-8"))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    preview_text = payload["previewText"]
    characters = payload["characters"]

    failures: list[str] = []

    for character in characters:
        destination = OUTPUT_DIR / f"{character['id']}.mp3"
        if destination.exists() and not args.force:
            print(f"skip  {destination.name}")
            continue

        ssml = build_ssml(character, preview_text)
        try:
            synthesize_preview(
                api_key=api_key,
                region=region,
                ssml=ssml,
                destination=destination,
            )
            print(f"write {destination.name}")
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            failures.append(f"{character['id']}: HTTP {error.code} {body}")
        except urllib.error.URLError as error:
            failures.append(f"{character['id']}: {error.reason}")

    if failures:
        print("\nFailed previews:", file=sys.stderr)
        for failure in failures:
            print(f"  - {failure}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
