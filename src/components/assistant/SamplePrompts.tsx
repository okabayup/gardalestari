
'use client';

import { Button } from '@/components/ui/button';

const samplePrompts = [
    'Bagaimana cara mengajukan ide baru?',
    'Bantu saya membuat ide bisnis di sektor pertanian.',
    'Program apa saja yang sedang dibuka?',
    'Bagaimana cara melihat Kartu Tanda Anggota saya?',
];

interface SamplePromptsProps {
    onSelectPrompt: (prompt: string) => void;
}

const SamplePrompts = ({ onSelectPrompt }: SamplePromptsProps) => {
    return (
        <div className="space-y-2 pt-4">
            <p className="text-xs text-muted-foreground font-semibold">Atau coba salah satu dari ini:</p>
            <div className="flex flex-wrap gap-2">
                {samplePrompts.map(prompt => (
                    <Button key={prompt} size="sm" variant="outline" onClick={() => onSelectPrompt(prompt)}>
                        {prompt}
                    </Button>
                ))}
            </div>
        </div>
    );
}

export default SamplePrompts;
