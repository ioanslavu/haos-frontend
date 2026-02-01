/**
 * useWorkTab - Custom hook for WorkTab state and logic
 */

import { useState, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useSplitsByObject, useDeleteCredit, useCreditsByObject } from '@/api/hooks/useRights'
import { fetchSongWork, createWorkInSongContext } from '@/api/songApi'
import { useUpdateWork } from '@/api/hooks/useSongs'
import { toast as sonnerToast } from 'sonner'
import type { Song } from '@/types/song'

export type ViewMode = 'details' | 'create' | 'edit'

// Form schema
export const workFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  alternate_titles: z.string().optional(),
  language: z.string().optional(),
  genre: z.string().optional(),
  sub_genre: z.string().optional(),
  year_composed: z
    .number()
    .min(1000)
    .max(9999)
    .optional()
    .or(z.literal('')),
  lyrics: z.string().optional(),
  notes: z.string().optional(),
  translation_of: z
    .number()
    .optional()
    .or(z.literal('')),
  adaptation_of: z
    .number()
    .optional()
    .or(z.literal('')),
})

export type WorkFormValues = z.infer<typeof workFormSchema>

export function useWorkTab(song: Song) {
  const queryClient = useQueryClient()
  const songId = song.id
  const hasWork = !!song.work

  const [viewMode, setViewMode] = useState<ViewMode>('details')
  const [activeFormTab, setActiveFormTab] = useState('basic')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog states for details view
  const [iswcDialogOpen, setIswcDialogOpen] = useState(false)
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [editingCredit, setEditingCredit] = useState<any>(null)
  const [writerSplitDialogOpen, setWriterSplitDialogOpen] = useState(false)
  const [publisherSplitDialogOpen, setPublisherSplitDialogOpen] = useState(false)

  // Queries - Fetch work from song context
  const { data: workData, isLoading: workLoading } = useQuery({
    queryKey: ['song-work', songId],
    queryFn: () => fetchSongWork(songId),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 404) return false
      return failureCount < 3
    },
  })

  const workDetails = workData?.data
  const workId = workDetails?.id

  // Fetch credits and splits using the workId
  const { data: credits } = useCreditsByObject('work', workId, !!workId)
  const { data: writerSplits } = useSplitsByObject('work', workId, 'writer')
  const { data: publisherSplits } = useSplitsByObject('work', workId, 'publisher')

  // Mutations
  const deleteCredit = useDeleteCredit()
  const updateWork = useUpdateWork()

  // Form
  const form = useForm<WorkFormValues>({
    resolver: zodResolver(workFormSchema),
    defaultValues: {
      title: '',
      alternate_titles: '',
      language: '',
      genre: '',
      sub_genre: '',
      year_composed: '' as any,
      lyrics: '',
      notes: '',
      translation_of: '' as any,
      adaptation_of: '' as any,
    },
  })

  // Populate form when editing or creating
  useEffect(() => {
    if (viewMode === 'edit' && workDetails) {
      form.reset({
        title: workDetails.title || '',
        alternate_titles: Array.isArray(workDetails.alternate_titles)
          ? workDetails.alternate_titles.join(', ')
          : workDetails.alternate_titles || '',
        language: workDetails.language || '',
        genre: workDetails.genre || '',
        sub_genre: workDetails.sub_genre || '',
        year_composed: workDetails.year_composed || ('' as any),
        lyrics: workDetails.lyrics || '',
        notes: workDetails.notes || '',
        translation_of: workDetails.translation_of || ('' as any),
        adaptation_of: workDetails.adaptation_of || ('' as any),
      })
    } else if (viewMode === 'create') {
      form.reset({
        title: song.title || '',
        alternate_titles: '',
        language: song.language || '',
        genre: song.genre || '',
        sub_genre: '',
        year_composed: '' as any,
        lyrics: '',
        notes: '',
        translation_of: '' as any,
        adaptation_of: '' as any,
      })
    }
  }, [viewMode, workDetails, song, form])

  // Delete credit handler
  const handleDeleteCredit = async (creditId: number) => {
    if (!confirm('Are you sure you want to delete this credit?')) return

    try {
      await deleteCredit.mutateAsync(creditId)
      sonnerToast.success('Credit deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['song-work', songId] })
    } catch (error: any) {
      console.error('Failed to delete credit:', error)
      sonnerToast.error(error.response?.data?.detail || 'Failed to delete credit')
    }
  }

  const onSubmit = async (values: WorkFormValues) => {
    setIsSubmitting(true)
    try {
      const payload: any = {
        title: values.title,
      }

      if (values.alternate_titles && values.alternate_titles.trim()) {
        payload.alternate_titles = values.alternate_titles
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t)
      }

      if (values.language && values.language.trim()) payload.language = values.language
      if (values.genre && values.genre.trim()) payload.genre = values.genre
      if (values.sub_genre && values.sub_genre.trim()) payload.sub_genre = values.sub_genre
      if (values.year_composed && values.year_composed !== '')
        payload.year_composed = Number(values.year_composed)
      if (values.lyrics && values.lyrics.trim()) payload.lyrics = values.lyrics
      if (values.notes && values.notes.trim()) payload.notes = values.notes
      if (values.translation_of && values.translation_of !== '')
        payload.translation_of = Number(values.translation_of)
      if (values.adaptation_of && values.adaptation_of !== '')
        payload.adaptation_of = Number(values.adaptation_of)

      if (viewMode === 'create') {
        await createWorkInSongContext(songId, payload)
        sonnerToast.success('Work created and linked to song')
        queryClient.invalidateQueries({ queryKey: ['song', song.id] })
        queryClient.invalidateQueries({ queryKey: ['song-work', songId] })
        setViewMode('details')
      } else if (viewMode === 'edit' && workId) {
        await updateWork.mutateAsync({ id: workId, payload })
        sonnerToast.success('Work updated successfully')
        setViewMode('details')
      }
    } catch (error: any) {
      console.error('Failed to save work:', error)
      sonnerToast.error(error.response?.data?.detail || 'Failed to save work')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setViewMode('details')
    form.reset()
  }

  // Calculate totals
  const writerTotal = writerSplits?.reduce((sum, split) => sum + Number(split.share || 0), 0) || 0
  const publisherTotal =
    publisherSplits?.reduce((sum, split) => sum + Number(split.share || 0), 0) || 0

  return {
    // Core data
    song,
    songId,
    hasWork,
    workDetails,
    workId,
    workLoading,

    // Related data
    credits,
    writerSplits,
    publisherSplits,
    writerTotal,
    publisherTotal,

    // UI State
    viewMode,
    setViewMode,
    activeFormTab,
    setActiveFormTab,
    isSubmitting,

    // Dialog state
    iswcDialogOpen,
    setIswcDialogOpen,
    creditDialogOpen,
    setCreditDialogOpen,
    editingCredit,
    setEditingCredit,
    writerSplitDialogOpen,
    setWriterSplitDialogOpen,
    publisherSplitDialogOpen,
    setPublisherSplitDialogOpen,

    // Form
    form,

    // Handlers
    onSubmit,
    handleCancel,
    handleDeleteCredit,
    queryClient,
  }
}
