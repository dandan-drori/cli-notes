export enum TagActions {
    list = "LIST",
    add = "ADD",
    edit = "EDIT",
    remove = "DELETE",
    apply = "APPLY",
    back = "BACK",
}

export const tagActionQuestion = [
    {
        type: "list",
        name: "tagAction",
        message: "What would you like to do?",
        choices: [
            {
                name: "List all tags",
                value: TagActions.list,
            },
            {
                name: "Create a new tag",
                value: TagActions.add,
            },
            {
                name: "Edit a tag",
                value: TagActions.edit,
            },
            {
                name: "Delete a tag",
                value: TagActions.remove,
            },
            {
                name: "Apply a tag to a note",
                value: TagActions.apply,
            },
            {
                name: "Back",
                value: TagActions.back,
            },
        ]
    }
]
