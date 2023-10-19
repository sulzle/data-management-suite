import { db } from '~/utils/db.server'
import { withCors } from '~/utils/withCors'
import stacPackageJson from 'stac-spec/package.json'
import { getStacValidator } from '~/utils/stacspec'
import { zx } from 'zodix'
import { z } from 'zod'
import { getHost } from '~/routes'

export let loader = withCors(async ({ request, params }) => {
  let { collectionId } = zx.parseParams(params, {
    collectionId: z.string(),
  })
  let validate = await getStacValidator('Collection')

  let baseUrl = `${getHost(request)}/stac`

  let collection = await db.collection.findUniqueOrThrow({
    where: {
      id: collectionId,
    },
  })

  let stacCollection = {
    type: 'Collection',
    stac_version: stacPackageJson.version,
    id: collection.title,
    description: collection.description ?? '',
    license: 'MIT',
    extent: {
      spatial: {
        bbox: [[-180, -90, 180, 90]],
      },
      temporal: {
        interval: [
          [
            collection.startTime?.toISOString() ?? new Date().toISOString(),
            collection.endTime ?? null,
          ],
        ],
      },
    },
    links: [
      {
        rel: 'items',
        type: 'application/geo+json',
        href: `${baseUrl}/collections/${collection.id}/items`,
      },
      {
        rel: 'self',
        type: 'application/json',
        href: `${baseUrl}/collections/${collection.id}`,
      },
    ],
  }

  if (validate(stacCollection)) {
    return stacCollection
  } else {
    return { errors: validate.errors, data: stacCollection }
  }
})