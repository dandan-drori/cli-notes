export enum TrashActions {
    list = "LIST",
    delete = "DELETE",
    restore = "RESTORE",
    empty = "EMPTY",
    back = "BACK"
}

export const trashActionQuestion = [
    {
        type: "list",
        name: "trashAction",
        message: "What would you like to do?",
        choices: [
            {
                name: "List all notes in trash",
                value: TrashActions.list,
            },
            {
                name: "Permanently delete a note",
                value: TrashActions.delete,
            },
            {
                name: "Restore a note from trash",
                value: TrashActions.restore,
            },
            {
                name: "Empty trash",
                value: TrashActions.empty,
            },
            {
                name: "Back",
                value: TrashActions.back,
            },
        ]
    }
]
