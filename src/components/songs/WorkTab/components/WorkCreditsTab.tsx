/**
 * WorkCreditsTab - Credits management for a work
 */

import { Users, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Credit {
  id: number
  entity_name?: string
  role: string
  role_display?: string
  credited_as?: string
  share_kind?: string
  share_value?: number
  share_kind_display?: string
}

interface WorkCreditsTabProps {
  credits: Credit[] | undefined
  onAddCredit: () => void
  onEditCredit: (credit: Credit) => void
  onDeleteCredit: (creditId: number) => void
}

export function WorkCreditsTab({
  credits,
  onAddCredit,
  onEditCredit,
  onDeleteCredit,
}: WorkCreditsTabProps) {
  return (
    <Card className="backdrop-blur-xl bg-background/80 border-white/10 shadow-lg rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Credits
          </CardTitle>
          <Button size="sm" onClick={onAddCredit}>
            <Plus className="h-4 w-4 mr-2" />
            Add Credit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {credits && credits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Credited As</TableHead>
                <TableHead>Share</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {credits.map((credit) => (
                <TableRow key={credit.id}>
                  <TableCell className="font-medium">{credit.entity_name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{credit.role_display || credit.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{credit.credited_as || '-'}</TableCell>
                  <TableCell>
                    {credit.share_kind && credit.share_kind !== 'none' ? (
                      <div className="flex flex-col">
                        <span className="text-sm">{credit.share_value}%</span>
                        <span className="text-xs text-muted-foreground">
                          {credit.share_kind_display}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditCredit(credit)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeleteCredit(credit.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No credits added yet</p>
            <Button className="mt-4" onClick={onAddCredit}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Credit
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
