import type { StepConfig, RegistrationSummary } from '@/components/types/registration.d.ts'

// Données mockées pour chaque étape
const steps: Record<string, StepConfig> = {
  personal_information: {
    total_steps: 4,
    current_step: 1,
    title: 'Informations personnelles',
    slug: 'personal_information',
    assets: {
      type: 'form',
      fields: [
        {
          name: 'first_name',
          type: 'text',
          label: 'Prénom',
          required: true,
          placeholder: 'Votre prénom',
        },
        {
          name: 'last_name',
          type: 'text',
          label: 'Nom',
          required: true,
          placeholder: 'Votre nom',
        },
      ],
      validation: {
        first_name: ['required', 'min:2'],
        last_name: ['required', 'min:2'],
      },
    },
    data: {
      first_name: null,
      last_name: null,
    },
  },
  birthdate: {
    total_steps: 4,
    current_step: 2,
    title: 'Date de naissance',
    slug: 'birthdate',
    assets: {
      type: 'form',
      fields: [
        {
          name: 'birthdate',
          type: 'date',
          label: 'Date de naissance',
          required: true,
          placeholder: '',
        },
      ],
      validation: {
        birthdate: ['required', 'minAge:18'],
      },
    },
    data: {
      birthdate: null,
    },
  },
  picture: {
    total_steps: 4,
    current_step: 3,
    title: 'Photo de profil',
    slug: 'picture',
    assets: {
      type: 'form',
      fields: [
        {
          name: 'picture',
          type: 'file',
          label: 'Photo de profil',
          required: true,
          placeholder: '',
        },
      ],
      validation: {
        picture: ['required', 'fileType:jpg,png', 'maxSize:2MB'],
      },
    },
    data: {
      picture: null,
    },
  },
  address: {
    total_steps: 4,
    current_step: 4,
    title: 'Adresse',
    slug: 'address',
    assets: {
      type: 'form',
      fields: [
        {
          name: 'address',
          type: 'text',
          label: 'Adresse',
          required: true,
          placeholder: 'Votre adresse',
        },
      ],
      validation: {
        address: ['required', 'complete'],
      },
    },
    data: {
      address: null,
    },
  },
}

// Labels pour le résumé
const stepLabels: Record<string, string> = {
  personal_information: 'Informations personnelles',
  birthdate: 'Date de naissance',
  picture: 'Photo de profil',
  address: 'Adresse',
}

function getSummaryData(): RegistrationSummary {
  // Génère dynamiquement le résumé à partir des données postées
  const personal = steps.personal_information.data
  const birth = steps.birthdate.data
  const pic = steps.picture.data
  const addr = steps.address.data

  return {
    title: 'Récapitulatif de votre inscription',
    is_valid:
      !addr ||
      (!!personal.first_name &&
        !!personal.last_name &&
        !!birth.birthdate &&
        !!pic.picture &&
        !!addr.address),
    steps: [
      {
        slug: 'personal_information',
        label: stepLabels.personal_information,
        has_error: !personal.first_name || !personal.last_name,
        data:
          personal.first_name && personal.last_name
            ? `${personal.first_name} ${personal.last_name}`
            : null,
        error: !personal.first_name || !personal.last_name ? 'Prénom ou nom manquant' : undefined,
      },
      {
        slug: 'birthdate',
        label: stepLabels.birthdate,
        has_error: !birth.birthdate,
        data: birth.birthdate || null,
        error: !birth.birthdate ? 'Date de naissance manquante' : undefined,
      },
      {
        slug: 'picture',
        label: stepLabels.picture,
        has_error: !pic.picture,
        data: pic.picture ? pic.fileName || 'photo.jpg' : null,
        error: !pic.picture ? 'Photo manquante' : undefined,
      },
      {
        slug: 'address',
        label: stepLabels.address,
        has_error: !addr.address,
        data: addr.address || null,
        error: !addr.address ? 'Adresse incomplete' : undefined,
      },
    ],
  }
}

// Intercepter les appels fetch pour simuler l'API
const originalFetch = window.fetch

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString()

  // Intercepter GET /api/registration/step/{slug}
  if (url.match(/\/api\/registration\/step\/([^\/]+)$/) && (!init || init.method === 'GET')) {
    const slug = url.match(/\/api\/registration\/step\/([^\/]+)$/)?.[1]
    if (slug && steps[slug]) {
      return new Response(JSON.stringify(steps[slug]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  // 1. Dans la partie POST interceptor, corrigez le stockage :
  if (url.match(/\/api\/registration\/step\/([^\/]+)$/) && init?.method === 'POST') {
    const slug = url.match(/\/api\/registration\/step\/([^\/]+)$/)?.[1]
    console.log('Mock POST', slug, JSON.parse(init.body as string))
    if (slug && steps[slug] && init.body) {
      try {
        const body = JSON.parse(init.body as string)
        steps[slug].data = { ...body.data }

        // Correction pour l'étape picture
        if (slug === 'picture' && body.data.picture) {
          // Si c'est un objet File avec un name
          if (
            body.data.picture &&
            typeof body.data.picture === 'object' &&
            body.data.picture.name
          ) {
            steps[slug].data.fileName = body.data.picture.name
          }
          // Si fileName est fourni directement dans les data
          else if (body.data.fileName) {
            steps[slug].data.fileName = body.data.fileName
          }
          
        }

        // Déterminer le slug suivant dynamiquement
        const order = Object.keys(steps)
        const currentIndex = order.indexOf(slug)
        const nextSlug =
          currentIndex >= 0 && currentIndex < order.length - 1 ? order[currentIndex + 1] : null
        return new Response(JSON.stringify({ ...steps[slug], next_slug: nextSlug }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
  }

  // Intercepter GET /api/registration/summary
  if (url === '/api/registration/summary' && (!init || init.method === 'GET')) {
    return new Response(JSON.stringify(getSummaryData()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Pour tous les autres appels, utiliser le fetch original
  return originalFetch(input, init)
}

export async function fetchStep(slug: string): Promise<StepConfig> {
  const response = await fetch(`/api/registration/step/${slug}`)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export async function postStep(slug: string, data: Record<string, any>): Promise<StepConfig> {
  const response = await fetch(`/api/registration/step/${slug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export async function fetchSummary(): Promise<RegistrationSummary> {
  const response = await fetch('/api/registration/summary')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}
