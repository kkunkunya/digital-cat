# Digital Cats workspace backup, 2026-10-16

This branch contains an encrypted, complete Git bundle of the preserved workspace
for DENE-2201. It includes the prior local commit and every staged, unstaged and
untracked file captured by snapshot commit `476400bde60a37d695ecb7821ca44ff34e483689`.
The original local snapshot branch is retained unchanged.

The raw workspace includes private browser and infrastructure caches. Those raw
Git objects are deliberately not published. The age decryption identity remains
on the owner's Mac, outside any repository, with mode 600, under
`~/.config/digital-cat-backups/backup-wip-2026-10-16.agekey`.
Do not upload that identity or decrypted bundles.

The public branch commit is an encrypted backup container. Its commit history is
intentionally different from the original local snapshot branch. Do not merge
this branch into the application or use it for deployment.

## Restore into a separate folder

Requires age and Git. From a checkout of this backup branch on the owner's Mac:

```sh
cat snapshot.bundle.age.part* > ../digital-cat-snapshot.bundle.age
age --decrypt --identity "$HOME/.config/digital-cat-backups/backup-wip-2026-10-16.agekey" --output ../digital-cat-snapshot.bundle ../digital-cat-snapshot.bundle.age
git bundle verify ../digital-cat-snapshot.bundle
git clone --branch backup/wip-2026-10-16 ../digital-cat-snapshot.bundle ../digital-cat-restored
```

Validate the decrypted file against `bundle_sha256` in `manifest.json`. Decryption
and SHA-256 round-trip verification, followed by Git bundle verification, passed
before this backup was published. The application branches are not changed by
this backup.
