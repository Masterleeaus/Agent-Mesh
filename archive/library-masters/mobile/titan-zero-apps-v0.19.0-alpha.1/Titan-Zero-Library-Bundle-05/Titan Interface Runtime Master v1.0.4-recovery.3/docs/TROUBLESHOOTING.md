# Troubleshooting

- If routes are absent, confirm the extension is enabled and `titan-interface-runtime.enabled` is true.
- If provider loading fails, verify the custom extension registry discovered `App\Extensions\TitanInterfaceRuntime\System\TitanInterfaceRuntimeServiceProvider`.
- If future composition fails, do not add direct domain queries as a workaround; fix the missing contribution/authority adapter.
