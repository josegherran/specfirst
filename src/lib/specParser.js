export function detectInputRichness(input) {
  const wordCount = input.trim().split(/\s+/).length;
  const hasVerb = /\b(is|are|will|should|must|need|allow|prevent|handle|process|manage)\b/i.test(input);
  const hasActor = /\b(user|admin|customer|system|service|team|manager)\b/i.test(input);
  return wordCount >= 10 || (hasVerb && hasActor) ? 'rich' : 'thin';
}

export function isLoopComplete(spec) {
  return spec.problem.content !== null
    && spec.constraints.content !== null
    && spec.systemBoundaries.content !== null;
}
