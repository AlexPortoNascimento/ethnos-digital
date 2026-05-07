```mermaid
classDiagram
    class GameEngine {
        -players: Player[]
        -kingdoms: Kingdom[]
        -deck: Deck
        -currentAge: number
        -dragonsFound: number
        +startNewAge()
        +processTurn(action: Action)
        +evaluateEndAge()
    }

    class Player {
        -id: string
        -hand: Card[]
        -playedBands: Band[]
        -glory: number
        -orcHordeMarkers: Map<Color, boolean>
        +addCard(card: Card)
        +removeCard(card: Card)
    }

    class Kingdom {
        -color: KingdomColor
        -gloryTokens: number[]
        -controlMarkers: Map<PlayerId, number>
        +getLeaderboard()
    }

    class Card {
        -tribe: TribeName
        -color: KingdomColor
    }

    class Band {
        -cards: Card[]
        -leader: Card
        +isValid(): boolean
        +calculateBaseScore(): number
    }

    class ITribeAbility {
        <<interface>>
        +execute(band: Band, context: GameContext)
    }

    class MoveValidator {
        +canRecruit(player: Player): boolean
        +canPlayBand(player: Player, band: Band): boolean
        +canPlaceMarker(player: Player, kingdom: Kingdom, bandSize: number): boolean
    }

    class ScoreCalculator {
        +getKingdomGlory(kingdom: Kingdom, age: number): Map<PlayerId, number>
        +getBandGlory(band: Band): number
    }

    class PrismaRepository {
        +saveGameState(engine: GameEngine)
        +loadGameState(): GameEngine
    }

    class TerminalUI {
        -inquirer: Inquirer
        +showMainMenu()
        +promptMove(player: Player)
        +renderBoard(kingdoms: Kingdom[])
    }

    %% Relacionamentos
    GameEngine "1" *-- "2..6" Player
    GameEngine "1" *-- "6" Kingdom
    GameEngine "1" *-- "1" Deck
    Player "1" *-- "0..10" Card : hand
    Player "1" *-- "*" Band
    Band "1" *-- "1..10" Card
    Card ..> ITribeAbility : Strategy
    GameEngine ..> MoveValidator : uses
    GameEngine ..> ScoreCalculator : uses
    GameEngine ..> PrismaRepository : persists