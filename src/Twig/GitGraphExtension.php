<?php

namespace Wexample\SymfonyCoding\Twig;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;
use Wexample\SymfonyHelpers\Service\GitRepositoryReader;

/**
 * A repository's history as the design system's graph log reads it:
 * `graph_log(git_graph_items(path))`. The commits come from the shared git
 * reader, which never gets in git's way; this only says what each one shows —
 * its subject, its author, its date, its short hash — and colours the refs
 * pointing at it: the branch checked out, the other local ones, the tags, the
 * remote ones last and grey.
 */
class GitGraphExtension extends AbstractExtension
{
    public function __construct(
        private readonly GitRepositoryReader $git,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('git_graph_items', $this->gitGraphItems(...)),
        ];
    }

    /**
     * The app's own repository when no path is given.
     *
     * @return array<array{id: string, parents: string[], title: string, code: string, meta: string, date: string, refs: array<array{label: string, tone: string}>}>
     */
    public function gitGraphItems(?string $path = null, int $limit = 50): array
    {
        $commits = $this->git->log($path ?? $this->projectDir, $limit) ?? [];

        return array_map(fn (array $commit): array => [
            'id' => $commit['hash'],
            'parents' => $commit['parents'],
            'title' => $commit['subject'],
            'code' => substr($commit['hash'], 0, 7),
            'meta' => $commit['author'],
            'date' => $commit['date'],
            'refs' => $this->refs($commit['refs']),
        ], $commits);
    }

    /**
     * @param string[] $refs
     *
     * @return array<array{label: string, tone: string}>
     */
    private function refs(array $refs): array
    {
        $shown = [];

        foreach ($refs as $ref) {
            if (str_starts_with($ref, 'HEAD -> ')) {
                $shown[] = ['label' => substr($ref, strlen('HEAD -> ')), 'tone' => 'info'];
            } elseif ('HEAD' === $ref) {
                $shown[] = ['label' => 'HEAD', 'tone' => 'info'];
            } elseif (str_starts_with($ref, 'tag: ')) {
                $shown[] = ['label' => substr($ref, strlen('tag: ')), 'tone' => 'cat-sunflower'];
            } elseif (str_ends_with($ref, '/HEAD')) {
                // Where a remote points by default: it says nothing the
                // remote branch beside it does not already.
                continue;
            } elseif (str_contains($ref, '/')) {
                $shown[] = ['label' => $ref, 'tone' => 'neutral'];
            } else {
                $shown[] = ['label' => $ref, 'tone' => 'cat-grass'];
            }
        }

        return $shown;
    }
}
