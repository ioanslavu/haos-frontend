/**
 * WorkForm - Form for creating/editing a work
 */

import { Music, X, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { UseFormReturn } from 'react-hook-form'
import type { WorkFormValues, ViewMode } from '../hooks/useWorkTab'

interface WorkFormProps {
  form: UseFormReturn<WorkFormValues>
  viewMode: ViewMode
  activeFormTab: string
  setActiveFormTab: (tab: string) => void
  isSubmitting: boolean
  songTitle: string
  onSubmit: (values: WorkFormValues) => void
  onCancel: () => void
}

export function WorkForm({
  form,
  viewMode,
  activeFormTab,
  setActiveFormTab,
  isSubmitting,
  songTitle,
  onSubmit,
  onCancel,
}: WorkFormProps) {
  const isCreate = viewMode === 'create'

  return (
    <Card className="rounded-2xl border-white/10 bg-background/50 backdrop-blur-xl shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              {isCreate ? 'Create New Work' : 'Edit Work'}
            </CardTitle>
            <CardDescription>for {songTitle}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
              <TabsList>
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter work title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alternate_titles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternate Titles</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter alternate titles separated by commas..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Separate multiple titles with commas</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ro">Romanian</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                            <SelectItem value="pt">Portuguese</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                            <SelectItem value="ja">Japanese</SelectItem>
                            <SelectItem value="ko">Korean</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year_composed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year Composed</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="YYYY"
                            min="1000"
                            max="9999"
                            {...field}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : '')
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pop, Rock, Hip-Hop..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sub_genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-genre</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Indie Pop, Alternative Rock..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="lyrics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lyrics</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the full lyrics here..."
                          className="min-h-[300px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Full lyrics of the work</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes, reminders, or additional information..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Notes visible only to your team</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Relationships Tab */}
              <TabsContent value="relationships" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="translation_of"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Translation Of</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter work ID if this is a translation..."
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : '')
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Work ID of the original work (if this is a translation)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adaptation_of"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adaptation Of</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter work ID if this is an adaptation..."
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : '')
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Work ID of the original work (if this is an adaptation)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreate ? 'Create Work' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
