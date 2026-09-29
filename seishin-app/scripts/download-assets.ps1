$assetsDir = Join-Path $PSScriptRoot "..\public\assets"
New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null

$ids = @(
  "bd198681-2d0f-4e1f-87ca-662e8c175a17",
  "63ff80ba-fdaf-40ae-9f80-87a990baee9a",
  "afeff766-22fc-412e-b906-bd6d4e973bbb",
  "8ea8a916-105a-4a83-8e32-d584a7ae06fb",
  "8176e08b-6d04-42c1-b6ab-da6ff15df62e",
  "e00f4b08-bea2-4891-b65a-f86f172fadbd",
  "92fde038-6ee8-4843-a081-443fca7853c5",
  "ab0a74f4-f3a4-4a23-9d2b-93e79bdec46f",
  "bc6492f9-5eb7-436f-8a52-36d0f0ad49d7",
  "70057a1b-3701-4eec-b8e2-66c47577373c",
  "ff5a803a-823c-4eee-bedd-c581e93f633a",
  "c8d129bb-bbfc-4453-a658-5df5494960c5",
  "a536914c-08f2-4818-bcdf-fb4fdf313fca",
  "52c09984-38c7-456f-a378-069f00ec68d4",
  "30f12fda-cd6f-4300-a15f-48d8c4942b72",
  "27261edc-61d8-4457-87b2-8b8ffc1eec0b",
  "9352bd5d-abee-4ba4-bb1d-d8bc2e86e28a",
  "cc208aea-eb8d-45b8-8a81-d1d4dff63320",
  "f15f84df-378f-49c9-98aa-9d99b3dc4764",
  "3c1b9449-3468-4f2e-a3dc-002eba2b94f9",
  "8183eb6b-d0f0-4729-ac9f-b20f1ad9d784",
  "508f274d-fec6-4dea-8620-e439d35a40f1",
  "4a8778cc-08e4-4526-aa47-d85bbd752e86",
  "38df242f-aad5-4284-936c-4d9f5563e836",
  "0ab1a889-4164-4b72-8ede-d14d8b3e1307",
  "64de49de-62c0-49ad-9c46-54c39d8a6827",
  "151c39b5-331e-4d67-833d-c23e759e7052",
  "d5c9e881-7ad9-4879-8946-54dc67cb990c",
  "b2b19a37-daf8-43da-9cc5-2f72cfdd2759",
  "34b02e32-c471-4718-ae0a-ef08742b74a4",
  "a34952a5-3a2e-4489-9dd4-836e725af9f7",
  "fd5e943c-7a76-4783-ac4a-e2ab34a6a829",
  "851049b1-22dc-4f3e-b02f-d5fafe716361",
  "4fe58947-3c6d-4dd6-b577-8af28b4cbeeb",
  "1f1fa495-2c51-492b-9738-26de46992e92",
  "8010067b-0f49-4ee2-a17f-0257682f0e47",
  "4e2e22ad-10ca-4dfc-a006-56d7041dcc01",
  "aaeef6f2-4520-405a-9de6-35a88d9859f6",
  "f9fa34c0-00e4-490e-ba0a-db9cec988aa0",
  "75dc2e5a-3feb-4d37-86e8-c1fd072c5b79",
  "7932694e-75e3-41e8-824b-2093143cb1a8",
  "d5b46073-a913-4560-83e2-fcc28c566342",
  "ba447399-3c00-41fc-a704-f4f8f72c895f",
  "96972bcf-0227-42d1-ab7b-da3244569449",
  "6769d881-1ad9-4d84-babd-af64326db6ff",
  "2a6d3a09-5587-4bb1-bac2-0aee61d9f777",
  "71a41fdf-c4d1-4993-ae69-179ade8711d4",
  "7d83523d-7499-46d6-b11d-52bd99f7d12d",
  "a3236c34-4248-4066-9349-7253ebf0116c",
  "93c73cb3-a99a-4a74-b1e0-1a54b7a03925",
  "0f36aa08-d91e-4ad1-b280-0012cd4f4da8",
  "820bec22-0c6e-4e71-9921-bc8ee9640d63",
  "cccf243d-0922-45a4-bbd6-a10fa319c158",
  "6e150656-acfb-4ce7-97a9-461d89d225f8",
  "b0a2a52c-3878-4be2-b85c-714ba29a17fb"
)

foreach ($id in $ids) {
  $out = Join-Path $assetsDir "$id.svg"
  if (-not (Test-Path $out)) {
    $url = "https://www.figma.com/api/mcp/asset/$id"
    Write-Host "Downloading $id..."
    curl.exe -L -o $out $url
  }
}

Write-Host "Done. Downloaded assets to $assetsDir"
