"use client"

import { NexoraError } from "@/components/shared/NexoraError"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <NexoraError title="Purchases Error" message={error.message} errorType="UNKNOWN_ERROR" reset={reset} />
}
