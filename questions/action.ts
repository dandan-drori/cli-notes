export enum Actions {
    list = "LIST",
    create = "CREATE",
    remove = "DELETE",
    update = "UPDATE",
    search = "SEARCH",
}

export const action = [
    {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
            {
                name: "List all notes",
                value: Actions.list,
            },
            {
                name: "Create a new note",
                value: Actions.create,
            },
            {
                name: "Delete a note",
                value: Actions.remove,
            },
            {
                name: "Update a note",
                value: Actions.update,
            },
            {
                name: "Search notes",
                value: Actions.search,
            },
        ]
    }
]
