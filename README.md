# VPN list worker

`GET /api/server?take=20` returns up to 20 servers. Older requests with a higher `take` are capped at 20 results.

Download OpenVPN profiles from `GET /api/server/:ip/config?variant=current`.
The supported variants are `legacy`, `current`, and `beta`.

- `split=true` adds routes for Umamusume JP, Umamusume Global, and DMM.
  Global includes the game API (`api.games.umamusume.com`, which resolves
  through its EdgeKey alias) and assets (`assets-umamusume-en.akamaized.net`).
  DMM includes Game Player's API and `tv.dmm.com` for the catalog check;
  the catalog check does not verify playback.
  It also routes `www.gco.gov.qa` for the split-tunnel IP check;
  `umavpn.top` is not added to the route list.
- Original and split profiles block public IPv6 by default while connected,
  without changing IPv4 routing or filtering DNS AAAA records. Use
  `blockIpv6=false` to opt out. Clients that do not support `block-ipv6`
  (such as OpenVPN before 2.5) need the opt-out.

Example split profile with default IPv6 blocking:

```text
/api/server/192.0.2.1/config?variant=current&split=true
```

Run the worker tests with `bun test`.
