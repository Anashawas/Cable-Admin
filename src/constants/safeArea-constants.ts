const safeAreaTopRightBottomLeft = {
    pt: `env(safe-area-inset-top)`,
    pr: `env(safe-area-inset-right)`,
    pb: `env(safe-area-inset-bottom)`,
    pl: `env(safe-area-inset-left)`
}

const safeAreaRightBottomLeft = {
    pr: `env(safe-area-inset-right)`,
    pb: `env(safe-area-inset-bottom)`,
    pl: `env(safe-area-inset-left)`
}

const safeAreaTopRightLeft = {
    pt: `env(safe-area-inset-top)`,
    pr: `env(safe-area-inset-right)`,
    pl: `env(safe-area-inset-left)`
}

const safeAreaRightLeft = {
    pr: `env(safe-area-inset-right)`,
    pl: `env(safe-area-inset-left)`
}

export {
    safeAreaTopRightBottomLeft,
    safeAreaRightBottomLeft,
    safeAreaTopRightLeft,
    safeAreaRightLeft
}