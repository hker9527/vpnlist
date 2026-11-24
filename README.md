# VPN list worker

Download OpenVPN profiles from `GET /api/server/:ip/config?variant=current`.
The supported variants are `legacy`, `current`, and `beta`.

- `split=true` adds routes for Umamusume JP, Umamusume Global, and DMM.
  Global includes the game API (`api.games.umamusume.com`, which resolves
  through its EdgeKey alias) and assets (`assets-umamusume-en.akamaized.net`).
  DMM includes Game Player's API and `tv.dmm.com` for the catalog check;
  the catalog check does not verify playback.
  It also routes `www.gco.gov.qa` for the split-tunnel IP check;
  `umavpn.top` is not added to the route list.

Example split profile:

```text
/api/server/192.0.2.1/config?variant=current&split=true
```

Run the worker tests with `bun test`.
