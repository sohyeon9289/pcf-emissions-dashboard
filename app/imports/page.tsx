'use client';

import * as React from 'react';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Label, Select } from '@/components/ui/Input';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';
import { useCompanies, useActivityTypes } from '@/features/pcf/queries';
import { cn } from '@/lib/cn';
import { useQueryClient } from '@tanstack/react-query';

type PreviewRow = {
  rowIndex: number;
  date: string | null;
  rawType: string | null;
  description: string | null;
  amount: number | null;
  unit: string | null;
  typeKey: string | null;
  errors: string[];
};

type Preview = {
  sheetName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: PreviewRow[];
  fileName: string;
};

export default function ImportsPage() {
  const companies = useCompanies();
  const types = useActivityTypes();
  const toast = useToast();
  const qc = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [companyId, setCompanyId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [committing, setCommitting] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const typeLabel = (key: string | null) =>
    key ? types.data?.find((t) => t.key === key)?.label ?? key : null;

  const handleFile = async (selected: File) => {
    setFile(selected);
    setPreview(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', selected);
      form.append('mode', 'preview');
      const res = await fetch('/api/import/excel', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) {
        toast.push({ tone: 'error', title: '파싱 실패', description: json?.message });
      } else {
        setPreview(json as Preview);
        if ((json as Preview).errorRows > 0) {
          toast.push({
            tone: 'info',
            title: `${(json as Preview).errorRows}개 행에 오류가 있습니다.`,
            description: '오류 행은 저장에서 제외됩니다.',
          });
        }
      }
    } catch (e) {
      toast.push({
        tone: 'error',
        title: '업로드 실패',
        description: e instanceof Error ? e.message : '알 수 없는 오류',
      });
    } finally {
      setLoading(false);
    }
  };

  const onCommit = async () => {
    if (!file || !preview) return;
    if (!companyId) {
      toast.push({ tone: 'error', title: '회사를 선택해주세요.' });
      return;
    }
    setCommitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('mode', 'commit');
      form.append('companyId', companyId);
      const res = await fetch('/api/import/excel', { method: 'POST', body: form });
      const json = await res.json();
      if (!res.ok) {
        toast.push({ tone: 'error', title: '저장 실패', description: json?.message });
      } else {
        toast.push({
          tone: 'success',
          title: `${(json as { imported: number }).imported}개 활동 저장 완료`,
          description: `파일: ${(json as { fileName: string }).fileName}`,
        });
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        qc.invalidateQueries({ queryKey: ['activities'] });
      }
    } catch (e) {
      toast.push({
        tone: 'error',
        title: '저장 실패',
        description: e instanceof Error ? e.message : '알 수 없는 오류',
      });
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Excel 임포트</h1>
        <p className="text-sm text-muted-foreground">
          한글 과제 data.xlsx 형식을 가공 없이 그대로 업로드할 수 있습니다. 헤더(일자, 활동 유형,
          설명, 량, 단위)를 자동 인식하고, 오류가 있는 행은 저장에서 제외됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>파일 업로드</CardTitle>
          <CardDescription>드래그앤드롭 또는 클릭으로 .xlsx 파일을 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">
              {loading ? '파일 분석 중…' : file ? file.name : 'xlsx 파일을 끌어다 놓거나 클릭'}
            </p>
            <p className="text-xs text-muted-foreground">
              최대 4MB · 한글 헤더 자동 인식 (일자/활동 유형/설명/량/단위)
            </p>
          </label>
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  파싱 미리보기 · {preview.sheetName}
                </CardTitle>
                <CardDescription>
                  총 {preview.totalRows} 행 · 유효 {preview.validRows} · 오류 {preview.errorRows}
                </CardDescription>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label>대상 회사</Label>
                  <Select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="min-w-[180px]"
                  >
                    <option value="">선택…</option>
                    {companies.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  onClick={onCommit}
                  disabled={preview.validRows === 0 || !companyId}
                  loading={committing}
                >
                  {preview.validRows}건 저장
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {preview.rows.length === 0 ? (
              <EmptyState description="파싱된 데이터가 없습니다. 헤더 행을 확인해주세요." />
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                <Table>
                  <THead className="sticky top-0">
                    <TR>
                      <TH>#</TH>
                      <TH>일자</TH>
                      <TH>활동 유형</TH>
                      <TH>설명</TH>
                      <TH className="text-right">활동량</TH>
                      <TH>단위</TH>
                      <TH>상태</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {preview.rows.map((r) => (
                      <TR
                        key={r.rowIndex}
                        className={cn(r.errors.length > 0 && 'bg-destructive/5')}
                      >
                        <TD className="text-xs text-muted-foreground">{r.rowIndex}</TD>
                        <TD className="whitespace-nowrap font-mono text-xs">{r.date ?? '-'}</TD>
                        <TD>
                          <div className="flex flex-col">
                            <span>{r.rawType ?? '-'}</span>
                            {r.typeKey ? (
                              <span className="text-[10px] text-muted-foreground">
                                → {typeLabel(r.typeKey)}
                              </span>
                            ) : null}
                          </div>
                        </TD>
                        <TD className="text-xs">{r.description ?? '-'}</TD>
                        <TD className="text-right tabular-nums">{r.amount ?? '-'}</TD>
                        <TD>{r.unit ?? '-'}</TD>
                        <TD>
                          {r.errors.length === 0 ? (
                            <Badge tone="success">OK</Badge>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <Badge tone="destructive">오류</Badge>
                              <span className="text-[10px] text-destructive">
                                {r.errors.join(' · ')}
                              </span>
                            </div>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
