/**
 * WorkTab - Musical work management for songs
 *
 * Components:
 * - WorkLoadingState: Loading skeleton
 * - WorkEmptyState: No work linked state
 * - WorkForm: Create/edit form
 * - WorkDetailsView: Details view with tabs
 */

import { useWorkTab } from './hooks/useWorkTab'
import { WorkLoadingState } from './components/WorkLoadingState'
import { WorkEmptyState } from './components/WorkEmptyState'
import { WorkForm } from './components/WorkForm'
import { WorkDetailsView } from './components/WorkDetailsView'
import { AddISWCDialog } from '../dialogs/AddISWCDialog'
import { AddCreditDialog } from '../dialogs/AddCreditDialog'
import { AddSplitDialog } from '../dialogs/AddSplitDialog'
import type { Song } from '@/types/song'

interface WorkTabProps {
  song: Song
}

export function WorkTab({ song }: WorkTabProps) {
  const {
    // Core data
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
  } = useWorkTab(song)

  // Loading state
  if (workLoading && hasWork) {
    return <WorkLoadingState />
  }

  // No work - show empty state
  if (!hasWork && viewMode === 'details') {
    return <WorkEmptyState onCreateClick={() => setViewMode('create')} />
  }

  // Create or Edit mode - show form
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <WorkForm
        form={form}
        viewMode={viewMode}
        activeFormTab={activeFormTab}
        setActiveFormTab={setActiveFormTab}
        isSubmitting={isSubmitting}
        songTitle={song.title}
        onSubmit={onSubmit}
        onCancel={handleCancel}
      />
    )
  }

  // Details mode - show work details
  return (
    <>
      <WorkDetailsView
        work={workDetails}
        credits={credits}
        writerSplits={writerSplits}
        publisherSplits={publisherSplits}
        writerTotal={writerTotal}
        publisherTotal={publisherTotal}
        onEditClick={() => setViewMode('edit')}
        onAddISWC={() => setIswcDialogOpen(true)}
        onAddCredit={() => setCreditDialogOpen(true)}
        onEditCredit={(credit) => {
          setEditingCredit(credit)
          setCreditDialogOpen(true)
        }}
        onDeleteCredit={handleDeleteCredit}
        onAddWriterSplit={() => setWriterSplitDialogOpen(true)}
        onAddPublisherSplit={() => setPublisherSplitDialogOpen(true)}
      />

      {/* Dialogs */}
      {workId && (
        <>
          <AddISWCDialog
            open={iswcDialogOpen}
            onOpenChange={setIswcDialogOpen}
            workId={workId}
            onSuccess={() => {
              setIswcDialogOpen(false)
              queryClient.invalidateQueries({ queryKey: ['song-work', songId] })
            }}
          />
          <AddCreditDialog
            scope="work"
            objectId={workId}
            open={creditDialogOpen}
            onOpenChange={(open) => {
              setCreditDialogOpen(open)
              if (!open) setEditingCredit(null)
            }}
            credit={editingCredit}
          />
          <AddSplitDialog
            scope="work"
            objectId={workId}
            rightType="writer"
            open={writerSplitDialogOpen}
            onOpenChange={setWriterSplitDialogOpen}
          />
          <AddSplitDialog
            scope="work"
            objectId={workId}
            rightType="publisher"
            open={publisherSplitDialogOpen}
            onOpenChange={setPublisherSplitDialogOpen}
          />
        </>
      )}
    </>
  )
}
