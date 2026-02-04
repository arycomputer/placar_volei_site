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
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
    const { settings, setSettings } = useSettings();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newSettings = {
            theme: formData.get('theme') as 'light' | 'dark',
            pointsToWin: Number(formData.get('pointsToWin')),
            tieBreakPoints: Number(formData.get('tieBreakPoints')),
            teamABgColor: formData.get('teamABgColor') as string,
            teamAFgColor: formData.get('teamAFgColor') as string,
            teamBBgColor: formData.get('teamBBgColor') as string,
            teamBFgColor: formData.get('teamBFgColor') as string,
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
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Geral</h3>
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
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Regras</h3>
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
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Cores dos Times</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4 rounded-md border p-4">
                                        <h4 className="font-semibold">Time A (Casa)</h4>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="teamABgColor">Cor de Fundo</Label>
                                            <Input
                                                id="teamABgColor"
                                                name="teamABgColor"
                                                type="color"
                                                defaultValue={settings.teamABgColor}
                                                className="h-10 w-12 p-1"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="teamAFgColor">Cor da Fonte</Label>
                                            <Input
                                                id="teamAFgColor"
                                                name="teamAFgColor"
                                                type="color"
                                                defaultValue={settings.teamAFgColor}
                                                className="h-10 w-12 p-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4 rounded-md border p-4">
                                        <h4 className="font-semibold">Time B (Visitante)</h4>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="teamBBgColor">Cor de Fundo</Label>
                                            <Input
                                                id="teamBBgColor"
                                                name="teamBBgColor"
                                                type="color"
                                                defaultValue={settings.teamBBgColor}
                                                className="h-10 w-12 p-1"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="teamBFgColor">Cor da Fonte</Label>
                                            <Input
                                                id="teamBFgColor"
                                                name="teamBFgColor"
                                                type="color"
                                                defaultValue={settings.teamBFgColor}
                                                className="h-10 w-12 p-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Salvar Alterações</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
