export type Card = {
  name: string;
  url: string;
  scrapedAt: number,
  set: string,
  priceAvgs: {
    thirty: number,
    seven: number,
    one: number,
  };
}

export const getSetsFromArgsOrBreak : (argv: string[], sets: string[]) => string[] = (argv, sets) => {
	  const [_argv1, _argv2, ...possibleArguments] = argv
    const filteredArguments = possibleArguments.filter(setName => sets.includes(setName))

    if (possibleArguments.length != filteredArguments.length) {
      console.log("argument list does not fully contain set names")
      if (filteredArguments.length === 0 && possibleArguments.length !== 0) {
        console.log("in fact, none is a set. Assuming something is wrong, stopping")
        process.exit(-1)
      }
    }

    return (filteredArguments.length >= 1 ? filteredArguments : sets)
}

