---
"@praha/react-kit": patch
---

Add a fallback option to useStorageRef and useStorageState for handling invalid JSON in stored values

**Breaking change:** Previously, when a stored value was not valid JSON, it was silently treated as absent (`undefined`) with a `console.warn`. Now, an invalid JSON value causes the original `JSON.parse` error to be thrown unless a `fallback` option is provided to recover a value.
