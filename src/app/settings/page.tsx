"use client";

import Link from 'next/link';
import { useSettings } from '@/contexts/settings-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { FormEvent } from 'react';

export default function SettingsPage() {
    const { settings, setSettings } = useSettings();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSettings = {
            theme: formData.get('theme') as 'light' | 'dark',
            pointsToWin: Number(formData.get('pointsToWin')),
            tieBreakPoints: Number(formData.get('tieBreakPoints')),
        };
        setSettings(newSettings);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-2xl">
                <div className="mb-4">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Configurações</CardTitle>
                        <CardDescription>
                            Personalize a aparência e as regras da sua partida.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="theme">Tema</Label>
                                <Select name="theme" defaultValue={settings.theme}>
                                    <SelectTrigger id="theme">
                                        <SelectValue placeholder="Selecione o tema" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dark">Escuro</SelectItem>
                                        <SelectItem value="light">Claro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pointsToWin">Pontos para vencer o set</Label>
                                <Input
                                    id="pointsToWin"
                                    name="pointsToWin"
                                    type="number"
                                    defaultValue={settings.pointsToWin}
                                    min="1"
                                />
                                <p className="text-sm text-muted-foreground">
                                    A pontuação necessária para vencer um set normal.
                                </p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="tieBreakPoints">Pontos para vencer o tie-break</Label>
                                <Input
                                    id="tieBreakPoints"
                                    name="tieBreakPoints"
                                    type="number"
                                    defaultValue={settings.tieBreakPoints}
                                    min="1"
                                />
                                <p className="text-sm text-muted-foreground">
                                    A pontuação necessária para vencer o set final (tie-break).
                                </p>
                            </div>
                            <Button type="submit" className="w-full">Salvar Alterações</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
