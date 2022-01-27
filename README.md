# Sagendatabas-GUI

Användargränssnitt för avancerade versionen av sägenkartan.

node v12 not compatible with gulp v3.

```bash
nvm use 10.20.1 && gulp
```

följande anrop verkar ha problem:

| anrop | fel |
|---|---|
| https://frigg-test.isof.se/sagendatabas/api/es-dk/persons_graph/?country=sweden&search=troll&type=arkiv,tryckt&phrase_options=&sample_size=50000&vertices_size=800&min_doc_count=1&query_connections=false&terms_field=topics_10_10_graph |  "no handler found for uri [/isof-publik/_xpack/_graph/_explore] and method [GET]" | 
| https://frigg-test.isof.se/sagendatabas/api/es-dk/terms/?country=sweden&search=troll&type=arkiv,tryckt&phrase_options=&sort=parent_doc_count&count=15 | data: [] |
| https://frigg-test.isof.se/sagendatabas/api/es-dk/title_terms/?country=sweden&search=troll&type=arkiv,tryckt&phrase_options=&sort=parent_doc_count&count=15 | data: [] |