import axios from 'axios'

const TOKEN_KEY = 'sigclop_token'
const USER_KEY = 'sigclop_user'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',

    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },

    timeout: 30000,
})

/*
|--------------------------------------------------------------------------
| REQUEST INTERCEPTOR
|--------------------------------------------------------------------------
|
| Adiciona automaticamente o Bearer Token a todas as requisições
| autenticadas.
|
*/

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY)

        if(token) {
            config.headers = config.headers || {}
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },

    (error) => {
        return Promise.reject(error)
    }
)

/*
|--------------------------------------------------------------------------
| RESPONSE INTERCEPTOR
|--------------------------------------------------------------------------
|
| 401 → sessão inválida/expirada
| 403 → utilizador autenticado mas sem permissão
| 422 → erro de validação
| 404 → recurso não encontrado
| 500 → erro interno do servidor
|
*/

api.interceptors.response.use(
    (response) => {
        return response
    },

    async(error) => {
        const status = error ?.response?.status
        const request = error?.config

        /*
        |--------------------------------------------------------------------------
        | 401 - NÃO AUTENTICADO
        |--------------------------------------------------------------------------
        */

        if(status === 401) {
            const isLoginRequest = request?.url?.includes('/login')

            /*
            | Não tentar limpar/redirect durante uma tentativa
            | de login que simplesmente falhou.
            */

            if (!isLoginRequest) {
                clearAuthentication()

                redirectToLogin()
            }
        }

        /*
        |--------------------------------------------------------------------------
        | 403 - SEM PERMISSÃO
        |--------------------------------------------------------------------------
        */

        if(status === 403) {
            handleForbidden(error)
        }

        /*
        |--------------------------------------------------------------------------
        | 422 - VALIDAÇÃO
        |--------------------------------------------------------------------------
        */

        if(status === 422) {
            return Promise.reject(
                normalizeValidationError(error)
            )
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZAÇÃO DOS ERROS
        |--------------------------------------------------------------------------
        */

        return Promise.reject(
            normalizeApiError(error)
        )
    }
)

/*
|--------------------------------------------------------------------------
| LIMPAR AUTENTICAÇÃO
|--------------------------------------------------------------------------
*/

function clearAuthentication() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
}

/*
|--------------------------------------------------------------------------
| REDIRECT PARA LOGIN
|--------------------------------------------------------------------------
|
| Evitamos usar o router directamente aqui para não criar
| dependência circular entre api.js e router.js.
|
*/

function redirectToLogin() {
    if (window.location.pathname === '/login') {
        return
    }

    window.location.href = '/login'
}

/*
|--------------------------------------------------------------------------
| 403 - FORBIDDEN
|--------------------------------------------------------------------------
*/

function handleForbidden(error) {
    const message =
        error?.response?.data?.message ||
        'Não tem permissão para executar esta operação.'

    /*
    | Guardamos temporariamente o erro para que a interface
    | possa apresentá-lo caso necessário.
    */

    window.dispatchEvent(
        new CustomEvent('sigclop:forbidden', {
            detail: {
                message,
                response: error.response,
            },
        })
    )
}

/*
|--------------------------------------------------------------------------
| ERRO DE VALIDAÇÃO
|--------------------------------------------------------------------------
*/

function normalizeValidationError(error) {
    const response = error?.response

    const errors = response?.data?.errors || {}

    const message =
        response?.data?.message ||
        'Os dados enviados são inválidos.'

    const normalizedError = new Error(message)

    normalizedError.name = 'ValidationError'

    normalizedError.status = 422

    normalizedError.errors = errors

    normalizedError.response = response

    normalizedError.originalError = error

    return normalizedError
}

/*
|--------------------------------------------------------------------------
| ERRO DA API
|--------------------------------------------------------------------------
*/

function normalizeApiError(error) {
    const response = error?.response

    if(!response) {
        const networkError = new Error(
            'Não foi possível estabelecer ligação com o servidor.'
        )

        networkError.name = 'NetworkError'
        networkError.originalError = error

        return networkError
    }

    const message =
        response?.data?.message ||
        getStatusMessage(response.status) ||
        'Ocorreu um erro ao comunicar com o servidor.'

    const normalizedError = new Error(message)

    normalizedError.name = 'ApiError'
    normalizedError.status = response.status
    normalizedError.errors = response?.data?.errors || {}
    normalizedError.data = response?.data
    normalizedError.response = response
    normalizedError.originalError = error

    return normalizedError
}

/*
|--------------------------------------------------------------------------
| MENSAGENS POR STATUS
|--------------------------------------------------------------------------
*/

function getStatusMessage(status) {
    const messages = {
        400: 'Pedido inválido.',
        401: 'Sessão inválida ou expirada.',
        403: 'Não tem permissão para executar esta operação.',
        404: 'Recurso não encontrado.',
        405: 'Operação não permitida.',
        409: 'Não foi possível concluir a operação devido a um conflito.',
        419: 'A sessão expirou.',
        429: 'Demasiadas solicitações. Tente novamente mais tarde.',
        500: 'Erro interno do servidor.',
        502: 'O servidor está temporariamente indisponível.',
        503: 'Serviço temporariamente indisponível.',
    }

    return messages[status] || null
}

/*
|--------------------------------------------------------------------------
| HELPERS EXPORTADOS
|--------------------------------------------------------------------------
|
| Permitem utilizar estas funções fora do interceptor quando necessário.
|
*/

export function getApiErrorMessage(error) {
    return (
        error?.message || error?.response?.data?.message ||
        'Ocorreu um erro inesperado.'
    )
}

export function getValidationErrors(error) {
    return error?.errors ||
        error?.response?.data?.errors || {}
}

export function isValidationError(error) {
    return (
        error?.name === 'ValidationError' ||
        error?.status === 422 ||
        error?.response?.status === 422
    )
}

export function isUnauthorizedError(error) {
    return (
        error?.status === 401 ||
        error?.response?.status === 401
    )
}

export function isForbiddenError(error) {
    return (
        error?.status === 403 ||
        error?.response?.status === 403
    )
}

export function isNotFoundError(error) {
    return (
        error?.status === 404 ||
        error?.response?.status === 404
    )
}

export function isNetworkError(error) {
    return error?.name === 'NetworkError'
}