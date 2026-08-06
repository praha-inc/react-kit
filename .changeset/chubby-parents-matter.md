---
"@praha/react-kit": minor
---

Add useMountState hook and simplify useMount

**BREAKING CHANGE:** `useMount` no longer tracks or returns the mounted state, and its `fn` argument is now required instead of optional.

- `useMount` now returns `void` (previously returned a `boolean` indicating whether the component was mounted).
- Use the new `useMountState` hook if you need the mounted state.

```diff
- const isMounted = useMount(callback);
+ useMount(callback);
+ const isMounted = useMountState();
```
